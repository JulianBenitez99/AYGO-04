import boto3
import json


def lambda_handler(event, context):
    table = boto3.resource('dynamodb').Table('posts')
    posts = table.scan()['Items']
    return {
        'statusCode': 200,
        'body': json.dumps(posts),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        }
    }
