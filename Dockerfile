# syntax=docker/dockerfile:1

############################
# Stage 1 — build the jar  #
############################
FROM maven:3.9-eclipse-temurin-23 AS build
WORKDIR /app

# Resolve dependencies first so this layer is cached unless pom.xml changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Compile and package the Spring Boot fat-jar (tests skipped in image build)
COPY src ./src
RUN mvn -B -q clean package -DskipTests

############################
# Stage 2 — runtime image  #
############################
FROM eclipse-temurin:23-jre-alpine AS runtime
WORKDIR /app

# Run as an unprivileged user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy only the packaged application from the build stage
COPY --from=build /app/target/riglab-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
