FROM node:latest

WORKDIR /usr/src/app/my-app

COPY . .

#COPY package.json .
#COPY tsconfig.json .
#COPY entry.sh .
#RUN mkdir public
#COPY ./public/index.html ./public

EXPOSE 3000
RUN npm install -g npm@9.3.1
#RUN npm i
RUN npm install --legacy-peer-deps
ENTRYPOINT [ "bash", "entry.sh" ]

#CMD ["npm", "start"]