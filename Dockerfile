FROM node:17-alpine3.12 as BASE

RUN mkdir /home/node/app

RUN mkdir /home/node/app/node_modules && chown -R node:node /home/node/app
RUN ls -l /home/node/app

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
RUN npm install -g typescript

WORKDIR /home/node/app

COPY package.json /home/node/app/
COPY tsconfig.json /home/node/app/

USER node

RUN echo "Done setting up the base image configuration and files"

# 
FROM BASE as INTERMEDIATE
RUN ls -a 
RUN npm install && echo "Done setting up the intermediate image"

FROM INTERMEDIATE
COPY .env /home/node/app/
COPY src ./src
RUN tsc &&  ls -a

EXPOSE 27500

ENTRYPOINT [ "npm", "start" ]