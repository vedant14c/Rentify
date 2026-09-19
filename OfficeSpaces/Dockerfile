# Frontend build stage
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./
RUN npm run build

# Spring Boot build stage
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build

WORKDIR /app

COPY OfficeSpaces/pom.xml .
COPY OfficeSpaces/src ./src
COPY --from=frontend-build /frontend/dist ./frontend-dist

RUN rm -rf src/main/resources/static/assets \
           src/main/resources/static/index.html \
           src/main/resources/static/favicon.svg \
           src/main/resources/static/icons.svg \
    && mkdir -p src/main/resources/static/assets \
              src/main/resources/static/images \
    && cp frontend-dist/index.html src/main/resources/static/index.html \
    && cp frontend-dist/favicon.svg src/main/resources/static/favicon.svg \
    && cp frontend-dist/icons.svg src/main/resources/static/icons.svg \
    && cp -R frontend-dist/assets/. src/main/resources/static/assets/ \
    && cp -Rn frontend-dist/images/. src/main/resources/static/images/

RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]