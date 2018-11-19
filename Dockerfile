FROM node:8

WORKDIR "/app"

#add app code

COPY package.json .
COPY app.js .
COPY app.env ./app.env
COPY /public/ ./public/

#app uses this port
EXPOSE 8080

RUN source app.env

RUN npm install

CMD ["npm", "start"]
#CMD ["/bin/bash"] 