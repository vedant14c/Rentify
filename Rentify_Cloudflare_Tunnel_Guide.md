# Rentify --- Cloudflare Tunnel Quick Guide

## Purpose

This guide explains how to expose the locally running Rentify
application to the Internet using a Cloudflare Quick Tunnel.

Current local architecture:

``` text
Browser
   ↓
http://localhost:8080
   ↓
Spring Boot + React monolith
   ↓
MySQL
```

With Cloudflare Tunnel:

``` text
Internet
   ↓
Cloudflare
   ↓
Cloudflare Tunnel
   ↓
http://localhost:8080
   ↓
Rentify
```

## 1. Prerequisites

Rentify must already work locally at:

``` text
http://localhost:8080
```

`cloudflared` is installed at:

``` text
C:\Cloudflared\cloudflared.exe
```

Verify it:

``` powershell
C:\Cloudflared\cloudflared.exe --version
```

## 2. Start Rentify

Open **PowerShell Window 1**:

``` powershell
cd D:\Rentify\OfficeSpaces
java -jar target\OfficeSpaces-0.0.1-SNAPSHOT.jar
```

Wait until Spring Boot has started, then test:

``` text
http://localhost:8080
```

## 3. Start the Cloudflare Quick Tunnel

Open **PowerShell Window 2** and keep Window 1 running:

``` powershell
C:\Cloudflared\cloudflared.exe tunnel --url http://localhost:8080
```

Cloudflare will display a temporary public URL similar to:

``` text
https://example-name.trycloudflare.com
```

Open that URL in a browser.

The connection is:

``` text
https://example-name.trycloudflare.com
        ↓
Cloudflare
        ↓
http://localhost:8080
        ↓
Rentify
```

## 4. Example from a successful Rentify test

A previous Quick Tunnel generated:

``` text
https://obj-courage-motors-drives.trycloudflare.com
```

This URL is temporary. Do not treat it as the permanent Rentify URL. A
new Quick Tunnel can generate a different URL.

## 5. Keep both terminals running

### Window 1 --- Spring Boot

``` powershell
cd D:\Rentify\OfficeSpaces
java -jar target\OfficeSpaces-0.0.1-SNAPSHOT.jar
```

### Window 2 --- Cloudflare

``` powershell
C:\Cloudflared\cloudflared.exe tunnel --url http://localhost:8080
```

If either process stops, the public URL will stop working.

## 6. Test from outside your network

To verify Internet access:

1.  Start Spring Boot.
2.  Start the Cloudflare tunnel.
3.  Copy the generated `trycloudflare.com` URL.
4.  Open it on a phone using **mobile data**, rather than the same
    Wi-Fi.
5.  Test the Home page, Login, Property Listings, Property Details,
    Images, Booking pages, My Bookings, and other important API
    functions.

## 7. Successful tunnel output

A successful tunnel normally contains messages similar to:

``` text
Your quick Tunnel has been created!
```

``` text
Environment is healthy.
```

``` text
Registered tunnel connection
```

A line such as:

``` text
protocol=quic
```

means Cloudflare established a QUIC connection.

## 8. Troubleshooting

### `cloudflared` is not recognized

Use the full path:

``` powershell
C:\Cloudflared\cloudflared.exe --version
```

If this works, `cloudflared` is installed correctly even if
`cloudflared` alone is not in PATH.

### Public URL gives an error

First check:

``` text
http://localhost:8080
```

If the local application does not work, Cloudflare cannot fix it.

Then check that the Cloudflare terminal is still running.

Restart the tunnel if necessary:

``` powershell
C:\Cloudflared\cloudflared.exe tunnel --url http://localhost:8080
```

### Cloudflare gives a new URL

This is normal for Quick Tunnels. Quick Tunnel addresses use:

``` text
*.trycloudflare.com
```

Start the tunnel again and use the newly generated URL.

### React route gives 404

Test the route locally first:

``` text
http://localhost:8080
```

Then test the same route through the Cloudflare URL. If it works locally
but not through Cloudflare, investigate the Spring Boot SPA forwarding
configuration.

## 9. Quick Tunnel limitations

Quick Tunnels are useful for:

-   Development
-   Testing
-   Demonstrations
-   Temporarily sharing a local application

They should not be treated as permanent production hosting.

The computer running Rentify must remain:

-   Powered on
-   Connected to the Internet
-   Running Spring Boot
-   Running `cloudflared`

The public URL can stop working when the tunnel process is stopped.

## 10. Quick-start commands

### Terminal 1

``` powershell
cd D:\Rentify\OfficeSpaces
java -jar target\OfficeSpaces-0.0.1-SNAPSHOT.jar
```

### Terminal 2

``` powershell
C:\Cloudflared\cloudflared.exe tunnel --url http://localhost:8080
```

Then copy:

``` text
https://<generated-name>.trycloudflare.com
```

and open it.

## 11. Permanent Cloudflare Tunnel --- future option

For a stable address such as:

``` text
https://rentify.example.com
```

use a **named Cloudflare Tunnel** instead of a Quick Tunnel.

Future architecture:

``` text
https://rentify.example.com
            ↓
        Cloudflare
            ↓
   Named Cloudflare Tunnel
            ↓
       localhost:8080
            ↓
    Spring Boot + React
```

A permanent setup normally requires:

-   A domain
-   A Cloudflare account
-   A named tunnel
-   A public hostname
-   `cloudflared` configured to run the tunnel

## 12. Current Rentify architecture

``` text
                 Internet
                    │
                    ▼
              Cloudflare
                    │
                    ▼
          Cloudflare Quick Tunnel
                    │
                    ▼
             localhost:8080
                    │
          ┌─────────┴─────────┐
          │                   │
     React frontend      Spring Boot APIs
          │                   │
          └─────────┬─────────┘
                    │
                   MySQL
```

React and Spring Boot are served from the same Spring Boot application
and port.

## 13. File locations

Rentify:

``` text
D:\Rentify
```

Spring Boot:

``` text
D:\Rentify\OfficeSpaces
```

Packaged JAR:

``` text
D:\Rentify\OfficeSpaces\target\OfficeSpaces-0.0.1-SNAPSHOT.jar
```

Cloudflare executable:

``` text
C:\Cloudflared\cloudflared.exe
```

## 14. Command reference

Check Cloudflare:

``` powershell
C:\Cloudflared\cloudflared.exe --version
```

Start Rentify:

``` powershell
cd D:\Rentify\OfficeSpaces
java -jar target\OfficeSpaces-0.0.1-SNAPSHOT.jar
```

Start public tunnel:

``` powershell
C:\Cloudflared\cloudflared.exe tunnel --url http://localhost:8080
```

Local URL:

``` text
http://localhost:8080
```

Public URL:

``` text
https://<generated-name>.trycloudflare.com
```

## Important

Do not put passwords, JWT secrets, database credentials, Razorpay
secrets, mail passwords, or other `.env` values into this document.

For a permanent public deployment, use a named Cloudflare Tunnel or a
cloud hosting platform rather than relying on a Quick Tunnel from a
personal PC.
