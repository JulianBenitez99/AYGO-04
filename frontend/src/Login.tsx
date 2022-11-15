import React from "react";
import { Button } from "@mui/material";
import config from "./config";

const Login = () => {
  return (
    <Button
      variant="outlined"
      color="primary"
      href={`https://${config.cognito_hosted_domain}/login?response_type=token&client_id=${config.cognito_client_id}&redirect_uri=${config.redirect_url}`}
    >
      Login In
    </Button>
  );
};

export default Login;
