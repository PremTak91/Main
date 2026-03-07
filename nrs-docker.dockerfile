FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY target/nrsgroup-0.0.1.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java","-jar","app.jar"]