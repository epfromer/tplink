# Pull node image from Docker Hub
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn build

CMD ["node", "build/index.js"]

