# Stage 1: Build the application using Maven
FROM maven:3.9.7-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/nrsgroup-0.0.1.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java","-jar","app.jar"]