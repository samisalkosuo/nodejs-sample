FROM node:12.16.3-alpine3.10

WORKDIR "/app"

#add app code

COPY package.json .
COPY app.js .
COPY /public/ ./public/

#app uses this port
EXPOSE 6001

RUN npm install

CMD ["node","app.js"]
#CMD ["/bin/bash"] 