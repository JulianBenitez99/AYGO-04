import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

table_name = 'connections'
post_table = 'posts'


def handle_connect(table, connection_id):
    status_code = 200
    try:
        table.put_item(
            Item={'connection_id': connection_id})
        logger.info('Added connection_id: %s', connection_id)
    except ClientError as e:
        logger.exception('Failed to add connection_id: %s', connection_id)
        status_code = 503
    return status_code


def handle_disconnect(table, connection_id):
    status_code = 200
    try:
        table.delete_item(Key={'connection_id': connection_id})
        logger.info('Removed connection_id: %s', connection_id)
    except ClientError as e:
        logger.exception('Failed to remove connection_id: %s', connection_id)
        status_code = 503
    return status_code


def handle_post(table, post_tabledb, user, connection_id, event_body, apig_management_client):
    status_code = 200
    connection_ids = []
    try:
        scan_response = table.scan(ProjectionExpression='connection_id')
        connection_ids = [item['connection_id']
                          for item in scan_response['Items']]
        logger.info('Found %s active connections', len(connection_ids))
    except ClientError as e:
        logger.exception('Failed to get connections')
        status_code = 404
    post = json.dumps({'post': event_body['post'], 'name': user})
    logger.info('Sending post: %s', post)

    for connection in connection_ids:
        try:
            if connection != connection_id:
                send_reponse = apig_management_client.post_to_connection(
                    Data=post, ConnectionId=connection)
                logger.info('Sent post %s to %s, with response %s',
                            post, connection, send_reponse)
        except ClientError as e:
            logger.exception(
                'Failed to send post to connection %s', connection_id)
        except apig_management_client.exceptions.GoneException:
            logger.info('Connection %s is gone', connection)
            try:
                table.delete_item(Key={'connection_id': connection})
            except ClientError as e:
                logger.exception(
                    'Failed to remove connection_id: %s', connection)
    try:
        post_tabledb.put_item(
            Item={'post': event_body['post'], 'name': user})
        logger.info("Saved post: %s", post)
    except ClientError as e:
        logger.exception('Failed to save post: %s', post)
        status_code = 503

    return status_code


def lambda_handler(event, context):
    route_key = event.get('requestContext', {}).get('routeKey')
    connection_id = event.get('requestContext', {}).get('connectionId')
    logger.info('routeKey: %s', route_key)
    logger.info('connection_id: %s', connection_id)
    table = boto3.resource('dynamodb').Table(table_name)
    post_tabledb = boto3.resource('dynamodb').Table(post_table)
    domain = event.get('requestContext', {}).get('domainName')
    stage = event.get('requestContext', {}).get('stage')
    apig_management_client = boto3.client(
        'apigatewaymanagementapi', endpoint_url=f'https://{domain}/{stage}')
    response = {'statusCode': 200}
    if route_key == '$connect':
        response['statusCode'] = handle_connect(table, connection_id)
    elif route_key == '$disconnect':
        response['statusCode'] = handle_disconnect(table, connection_id)
    elif route_key == 'sendpost':
        body = event.get('body')
        body = json.loads(
            body if body is not None else '{post:"", name:"guest"}')
        user = body.get('name')
        response['statusCode'] = handle_post(
            table, post_tabledb, user, connection_id, body, apig_management_client)
    else:
        response['statusCode'] = 404
    return response
