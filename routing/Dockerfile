FROM maven:3.9-eclipse-temurin-21@sha256:8f6ac126f7810bb5549c4cd122d2bf0e9cda5bdeb0838aa928f09e779fd8bef8 AS downloader

ARG GRAPHHOPPER_VERSION=11.0
RUN mvn -q dependency:copy \
    -Dartifact=com.graphhopper:graphhopper-web:${GRAPHHOPPER_VERSION}:jar \
    -DoutputDirectory=/opt/graphhopper

FROM eclipse-temurin:21-jre@sha256:7a65df4b22d2de92d4e04056e884f3b9122d70b21e2847fd66084278bd0ce037

ARG GRAPHHOPPER_VERSION=11.0
WORKDIR /opt/graphhopper
COPY --from=downloader /opt/graphhopper/graphhopper-web-${GRAPHHOPPER_VERSION}.jar ./graphhopper.jar
COPY config.yml ./config.yml

EXPOSE 8989 8990
ENTRYPOINT ["java", "-jar", "graphhopper.jar", "server", "config.yml"]
