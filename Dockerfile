FROM node:8

WORKDIR "/app"

#add app code

COPY package.json .
COPY app.js .
COPY app.env ./app.env
COPY /public/ ./public/
COPY start_app.sh .
RUN chmod 755 start_app.sh

#app uses this port
EXPOSE 6001

RUN npm install

CMD ["./start_app.sh"]
#CMD ["/bin/bash"] 