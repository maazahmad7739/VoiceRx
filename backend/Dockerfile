FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma client
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]
