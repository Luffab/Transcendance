
FROM node:latest as base

WORKDIR /app
#COPY ["package.json", "package-lock*", "./"]

FROM base as dev

#COPY package.json .
#COPY tsconfig.json .
#COPY entry.sh .
COPY . .

RUN npm i
COPY . .
CMD ["npm", "run", "start:dev"]
#RUN node --max-old-space-size=4096 `which npm` install
#ENTRYPOINT [ "bash", "entry.sh" ]

#FROM base as prod
#RUN npm ci
#COPY . .
#RUN npm i -g @nestjs/cli
#RUN npm run build
#CMD ["npm", "run", "start:prod"]