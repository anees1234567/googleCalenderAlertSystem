import "express-session";

declare module "express-session" {
  interface SessionData {
    tokens?: any; 
    user?: any;  
    email?:string
  }
}

