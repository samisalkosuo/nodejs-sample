FROM node:15.9.0-alpine3.13

ENV HEAP_SIZE 2048

# Create user, change workdir and user
RUN adduser --disabled-password --home /app user
WORKDIR "/app"

#sets the directory and file permissions to allow users in the root group to access them (OpenShift)
RUN chgrp -R 0 /app && chmod -R g=u /app


COPY src/package.json .
#install dependencies
RUN npm install

#add app code
COPY src/ .

RUN date -R > buildtime.txt

USER user

#app uses this port
EXPOSE 8080


#CMD /bin/sh
CMD ["sh", "-c", "NPROC=$(nproc) node --max-old-space-size=${HEAP_SIZE} app.js"]
