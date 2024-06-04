# Pull node image from Docker Hub
FROM node:16

# Create app directory
WORKDIR /usr/src/app

ENV NODE_OPTIONS=--openssl-legacy-provider

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN NODE_OPTIONS=--openssl-legacy-provider yarn build

CMD ["node", "build/index.js"]

