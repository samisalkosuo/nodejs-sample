FROM node:15.9.0-alpine3.13

ENV HEAP_SIZE 2048

# Create user and change workdir
RUN adduser --disabled-password --home /app user

#create data directory
RUN mkdir -p /data && chown user:user /data

WORKDIR "/app"

#sets the directory and file permissions to allow users in the root group to access them (OpenShift)
RUN chown -R user:user /app && chgrp -R 0 /app && chmod -R g=u /app && chgrp -R 0 /data && chmod -R g=u /data

COPY src/package.json .
#install dependencies
RUN npm install

#npm install --save @instana/collector
#add app code
COPY src/ .

RUN chmod 755 /app/run_app.sh

RUN date -R > buildtime.txt

#use user
USER user

#app uses this port
EXPOSE 8080

#CMD /bin/sh
CMD ["sh", "-c", "/app/run_app.sh"]
