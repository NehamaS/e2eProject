FROM 10.106.146.20:5001/alpine-node:12 AS E2E_BUILD_IMAGE

RUN apk add --update --no-cache --virtual .gyp python py-pip make g++
RUN apk add --no-cache grep bash jq docker-cli curl

WORKDIR /opt/mcu

#RUN node -v && \
#    npm set registry http://10.106.146.20:8081 && \
#    npm ci --unsafe-perm && \
#    npm rebuild

RUN apk del .gyp

EXPOSE 5959

ENTRYPOINT  ["/bin/bash"]
