FROM seniocaires/c3270-web

ADD app/app.js /opt/app/app.js
ADD app/package.json /opt/app/package.json

RUN npm install