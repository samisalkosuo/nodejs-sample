#FROM node:15.9.0-alpine3.13
FROM node:16.15.1-alpine3.16

ENV HEAP_SIZE 2048

#create data directory
RUN mkdir -p /data 

WORKDIR "/app"


COPY src/package.json .
#install dependencies
RUN npm install

RUN npm install --save @instana/collector
#add app code
COPY src/ .

RUN chmod 755 /app/run_app.sh

RUN date -R > buildtime.txt

#app uses this port
EXPOSE 8080

#sets the directory and file permissions to allow users in the root group to access them
#for OpenShift
RUN chgrp -R 0 /app && chmod -R g=u /app && chgrp -R 0 /data && chmod -R g=u /data

#CMD /bin/sh
CMD ["sh", "-c", "/app/run_app.sh"]
