import base64 from "base-64";
import { Request, Response, NextFunction } from "express";

export const BasicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("Authorization header missing");
  }

  const auth = authHeader.split(" ")[1];

  if (!auth) {
    return res.status(401).send("Authorization header missing");
  }

  const decodedCredentials = base64.decode(auth);
  const [name, password] = decodedCredentials.split(":");

  const isMatch =
    name === process.env.AUTH_NAME && password === process.env.AUTH_PASSWORD;

  if (!isMatch) {
    return res.status(401).send("Invalid credentials");
  }

  next();
};

export const Authenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req?.user) {
    return res.status(401).send("Unauthorized");
  }
  next();
};
