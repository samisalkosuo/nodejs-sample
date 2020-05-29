FROM node:12.16.3-alpine3.11

# Create user, change workdir and user
RUN adduser --disabled-password --home /app user
WORKDIR "/app"
USER user

#add app code
COPY src/ .

#app uses this port
EXPOSE 6001

#install 
RUN npm install

CMD ["node","app.js"]
