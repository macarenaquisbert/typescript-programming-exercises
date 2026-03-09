FROM gitpod/workspace-full

USER gitpod

RUN npm i jest@29.7.0 jest-environment-jsdom@29.7.0 -g
RUN npm i @learnpack/learnpack@5.0.13 -g
