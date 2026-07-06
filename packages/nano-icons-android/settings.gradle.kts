pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "nano-icons-android"

include(":nanoicons")
include(":example")
project(":example").projectDir = file("example/app")
