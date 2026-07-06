FROM node:20-alpine
WORKDIR /app
RUN echo "FOO=from_env_file" > .env.production
COPY test-arg.js .
ARG FOO
# emulate next.js loading .env.production
RUN node -e "require('dotenv').config({path: '.env.production'}); console.log('FOO is: ' + process.env.FOO)"
