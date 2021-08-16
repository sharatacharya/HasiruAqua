FROM strapi/base:alpine

WORKDIR /strapi

COPY ./../app/package.json ./
COPY ./yarn.lock ./

RUN yarn install

COPY ./../app .

ENV NODE_ENV production 

RUN yarn build

EXPOSE 1337

CMD ["yarn", "start"]