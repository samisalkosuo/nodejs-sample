FROM node:16.16.0-alpine3.16

ENV HEAP_SIZE 2048

WORKDIR "/app"

COPY src/package.json .
#create data dir and install dependencies
RUN mkdir -p /data && \
    npm install && \
    npm install --save @instana/collector

#add app code
COPY src/ .

RUN chmod 755 /app/run_app.sh && \
    date -R > buildtime.txt

#app uses this port
EXPOSE 8080

#sets the directory and file permissions to allow users in the root group to access them
#for OpenShift
RUN chgrp -R 0 /app && chmod -R g=u /app && chgrp -R 0 /data && chmod -R g=u /data

#CMD /bin/sh
CMD ["sh", "-c", "/app/run_app.sh"]
