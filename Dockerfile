FROM node:15.9.0-alpine3.13

ENV HEAP_SIZE 2048

# Create user, change workdir and user
RUN adduser --disabled-password --home /app user
WORKDIR "/app"

COPY src/package.json .
#install dependencies
RUN npm install

#add app code
COPY src/ .

RUN date -R > buildtime.txt

USER user

#app uses this port
EXPOSE 8080

CMD ["sh", "-c", "NPROC=$(nproc) node --max-old-space-size=${HEAP_SIZE} app.js"]
