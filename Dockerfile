FROM node

ENV PORT 80

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
RUN npm install
COPY . .

RUN npm run build

EXPOSE 80

CMD [ "npm", "run", "start" ]