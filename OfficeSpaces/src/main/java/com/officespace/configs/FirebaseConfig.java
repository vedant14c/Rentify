//package com.officespace.configs;
//
//import java.io.IOException;
//import java.io.InputStream;
//
//import org.springframework.context.annotation.Configuration;
//
//import com.google.auth.oauth2.GoogleCredentials;
//import com.google.firebase.FirebaseApp;
//import com.google.firebase.FirebaseOptions;
//
//import jakarta.annotation.PostConstruct;
//
//@Configuration
//public class FirebaseConfig {
//
//    @PostConstruct
//    public void initialize() throws IOException {
//
//        if (!FirebaseApp.getApps().isEmpty()) {
//            return;
//        }
//
//        InputStream serviceAccount =
//                getClass().getClassLoader()
//                        .getResourceAsStream(
//                                "firebase/spacehub-4087a-firebase-adminsdk-fbsvc-c0f17b160c.json");
//
//        if (serviceAccount == null) {
//            throw new RuntimeException(
//                    "Firebase service account file not found.");
//        }
//
//        FirebaseOptions options = FirebaseOptions.builder()
//                .setCredentials(
//                        GoogleCredentials.fromStream(serviceAccount))
//                .build();
//
//        FirebaseApp.initializeApp(options);
//
//        System.out.println("====================================");
//        System.out.println("Firebase Initialized Successfully");
//        System.out.println("====================================");
//    }
//}