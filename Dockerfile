FROM node:8

WORKDIR "/app"

#add app code

COPY package.json .
COPY app.js .
COPY app.env ./.env
COPY /public/ ./public/

#app uses this port
EXPOSE 8080

RUN npm install

CMD ["npm", "start"]
#CMD ["/bin/bash"] 