# Pull node image from Docker Hub
FROM node:22

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN yarn build

CMD ["node", "build/index.js"]

