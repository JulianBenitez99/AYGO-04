import { useState, MouseEvent, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { w3cwebsocket } from "websocket";
import config from "./config";

const Post = ({
  currentUser,
  postsDb,
}: {
  currentUser: string;
  postsDb: Post[];
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [client, setClient] = useState<w3cwebsocket>();
  const [post, setPost] = useState<string>("");
  const [connected, setConnected] = useState<number>(0);

  useEffect(() => {
    if (client == undefined) {
      setClient(new w3cwebsocket(config.wss_url));
    }
    if (client) {
      client.onopen = () => {
        console.log("WebSocket Client Connected");
      };
      client.onmessage = (message) => {
        console.log("Message received", message);
        const postReceived = JSON.parse(message.data.toString());
        setPosts([postReceived, ...posts]);
      };
    }
  }, [client, posts]);

  const sendPost = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    client?.send(
      JSON.stringify({
        action: "sendpost",
        post: post,
        name: currentUser,
      })
    );
    setPosts([{ post: post, name: currentUser }, ...posts]);
  };

  const postList = [...posts, ...postsDb].map((post, id) => (
    <Box key={id}>
      <ListItem>
        <ListItemText primary={post.post} secondary={post.name} />
      </ListItem>
      <Divider />
    </Box>
  ));
  return (
    <Box>
      <List>{postList}</List>
      <Box margin={"auto"} textAlign={"center"} marginTop="4rem">
        <FormControl>
          <TextField
            id="outlined-basic"
            label="Post"
            variant="outlined"
            onChange={(v) => setPost(v.target.value)}
          />
          <Box marginTop={"1rem"}>
            <Button variant="contained" onClick={sendPost}>
              Post message
            </Button>
          </Box>
        </FormControl>
      </Box>
    </Box>
  );
};

type Post = {
  post: string;
  name: string;
};

export default Post;
