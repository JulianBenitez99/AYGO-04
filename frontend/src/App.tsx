import React, { useEffect, useState } from "react";
import Login from "./Login";
import Post from "./Post";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Box, Typography } from "@mui/material";
import config from "./config";
import axios from "axios";

const App = () => {
  const [token, setToken] = useState<string>("");
  const [validated, setValidated] = useState<boolean>(false);
  const [user, setUser] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    document.title = "Simple Social Media";
    getToken();
    validateToken().then((res) => {
      console.log("Token validated", res);
      setValidated(res);
      if (res) {
        getPosts();
      }
    });
  }, [token]);

  const getPosts = async () => {
    const response = await axios({
      url: config.rest_url,
      method: "GET",
      headers: {
        Authorization: token,
      },
    });
    if (response.status === 200) {
      console.log(response.data.body);
      setPosts(JSON.parse(response.data.body));
    }
  };

  const getToken = () => {
    const hash = window.location.hash;
    if (hash) {
      setToken(hash.split("=")[1].split("&")[0]);
    }
  };

  const validateToken = async () => {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: `${config.user_pool_id}`,
      tokenUse: "id",
      clientId: `${config.cognito_client_id}`,
    });

    try {
      console.log("Token", token);
      const payload = await verifier.verify(token);
      setUser(payload["cognito:username"]);
      console.log("Token is valid. Payload", payload);
      return true;
    } catch (error) {
      console.log("Token is invalid", error);
      return false;
    }
  };

  return (
    <Box>
      {validated ? (
        <Box>
          <Box margin={"auto"} textAlign={"center"} marginTop={"2rem"}>
            <Typography variant="h2">Posts</Typography>
          </Box>
          <Box
            margin={"auto"}
            textAlign={"center"}
            marginTop={"2rem"}
            width="75%"
          >
            <Post currentUser={user} postsDb={posts} />
          </Box>
        </Box>
      ) : (
        <Box
          margin={"auto"}
          width={"50%"}
          textAlign={"center"}
          marginTop={"35rem"}
        >
          <Box marginBottom={"2rem"}>
            <Typography variant="h2">Simple Social Media Web</Typography>
          </Box>
          <Login />
        </Box>
      )}
    </Box>
  );
};

export default App;
