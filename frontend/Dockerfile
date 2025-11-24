FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# React переменные окружения должны быть доступны во время сборки
# Они будут встроены в код при запуске npm start
ARG REACT_APP_API_URL=http://localhost:8000/api/v1
ENV REACT_APP_API_URL=$REACT_APP_API_URL

EXPOSE 3000

CMD ["npm", "start"]

