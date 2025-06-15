FROM node:18-alpine

WORKDIR /app

COPY . /app/

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "serve"]