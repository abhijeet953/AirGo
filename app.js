const express = require("express");
const app = express();
require("dotenv").config();
app.set("view engine", "ejs"); 
const path = require("path");
const https = require("https");
const request = require("request");
const bodyParser = require("body-parser");
//Conversion xml to json --->
const convert = require("xml-js");
// Database --->
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// Create and Print pdf --->
const fs = require("fs");
const { buildPathHtml, buildPathPdf } = require("./buildPaths");
var PDFDocument = require('pdfkit');
const NodePdfPrinter = require('node-pdf-printer');

// Use Methods --->
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("path"));
app.use(
  session({
    secret: "secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", true);
mongoose.connect(
  "mongodb+srv://AirGoabhinav:Pandey123@cluster0.gwuxrej.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
//get requests ...
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);
app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});
app.get("/register", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("register");
  }
  // res.render("register");
});
app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    }
  });
});
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get('/book', function(req, res){
    res.sendFile(__dirname + "/example.pdf");
});
// posts requests..
app.post("/book", async (req, res) => {
  console.log(req.body);

  // Create a document
  const doc = new PDFDocument();
  // var stream = doc.pipe(blobStream());
  // // Saving the pdf file in root directory.
  doc.pipe(fs.createWriteStream("example.pdf"));
  const date = new Date().getDate() + '/' + new Date().getMonth() + '/' + new Date().getFullYear();
      data_inp = [
        {
          invoiceId: req.body.bookingId,
          createdDate: date,
          departDate: req.body.departureTime,
          arrivalDate: req.body.arrivalTime,
          departure: req.body.departLocation,
          arrival: req.body.arrivalLocation,
          arrivalCode: req.body.arrivalCode,
          deaprtureCode: req.body.departureCode,
          companyName: req.body.companySrtName,
          invoiceName: (Math.random() + 1).toString(36).substring(7),
        }
      ];

  // // Adding functionality
  doc.fontSize(27).text("This is your ticket!", 100, 100);
  // doc
  //   // .addPage()
  //   .fontSize(15)
  //   .text("Generating PDF with the help of pdfkit", 100, 100);

  // Finalize PDF file
  doc.end();
  const array = [
    // '\example.pdf',
    path.resolve('/example.pdf')
  ]
  console.log(array);
  console.log(__dirname + "/example.pdf");
  // res.sendFile(__dirname + "/tmp/example.pdf");
  // try{
  //   res.sendFile(__dirname + "/example.pdf");
  //   // res.sendFile(__dirname + "/tmp/example.pdf");
  //   // NodePdfPrinter.printFiles(array);
  // }
  // catch(err) {
  //   console.log(err);
  //   // res.redirect('/');
  // }
  res.redirect('/book');

  // const url = stream.toBlobURL('application/pdf');
  // iframe.src = url;
  // console.log(url);
  //     const date = new Date().getDate() + '/' + new Date().getMonth() + '/' + new Date().getFullYear();
  //     data_inp = [
  //       {
  //         invoiceId: req.body.bookingId,
  //         createdDate: date,
  //         departDate: req.body.departureTime,
  //         arrivalDate: req.body.arrivalTime,
  //         departure: req.body.departLocation,
  //         arrival: req.body.arrivalLocation,
  //         arrivalCode: req.body.arrivalCode,
  //         deaprtureCode: req.body.departureCode,
  //         companyName: req.body.companySrtName,
  //         invoiceName: (Math.random() + 1).toString(36).substring(7),
  //       }
  //     ];

  //     const createRow = (item) => `
  // <tr>
  //   <td>${item.invoiceId}</td>
  //   <td>${item.invoiceName}</td>
  //   <td>${item.createdDate}</td>
  //   <td>${item.departDate}</td>
  //   <td>${item.arrivalDate}</td>
  //   <td>${item.departure}</td>
  //   <td>${item.arrival}</td>
  //   <td>${item.companyName}</td>
  // </tr>
  // `;

  //     /**
  //      * @description Generates an `html` table with all the table rows
  //      * @param {String} rows
  //      * @returns {String}
  //      */
  //     const createTable = (rows) => `
  //   <table>
  //     <tr>
  //         <th>Ticket Id</td>
  //         <th>Name</td>
  //         <th>Ticket Created</td>
  //         <th>Departure Date</td>
  //         <th>Arrival Date</td>
  //         <th>Departure</td>
  //         <th>Arrival</td>
  //         <th>Vendor Name</td>
  //     </tr>
  //     ${rows}
  //   </table>
  // `;

  //     /**
  //      * @description Generate an `html` page with a populated table
  //      * @param {String} table
  //      * @returns {String}
  //      */
  //     const createHtml = (table) => `
  //   <html>
  //     <head>
  //       <style>
  //         table {
  //           width: 100%;
  //         }
  //         tr {
  //           text-align: left;
  //           border: 1px solid black;
  //         }
  //         th, td {
  //           padding: 15px;
  //         }
  //         tr:nth-child(odd) {
  //           background: #CCC
  //         }
  //         tr:nth-child(even) {
  //           background: #FFF
  //         }
  //         .no-content {
  //           background-color: red;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       ${table}
  //     </body>
  //   </html>
  // `;

  //     /**
  //      * @description this method takes in a path as a string & returns true/false
  //      * as to if the specified file path exists in the system or not.
  //      * @param {String} filePath
  //      * @returns {Boolean}
  //      */
  //     const doesFileExist = (filePath) => {
  //       try {
  //         fs.statSync(filePath); // get information of the specified file path.
  //         return true;
  //       } catch (error) {
  //         return false;
  //       }
  //     };
  //     try {
  //       /* Check if the file for `html` build exists in system or not */
  //       if (doesFileExist(buildPathHtml)) {
  //         console.log("Deleting old build file");
  //         /* If the file exists delete the file from system */
  //         fs.unlinkSync(buildPathHtml);
  //       }
  //       /* generate rows */
  //       const rows = data_inp.map(createRow).join("");
  //       /* generate table */
  //       const table = createTable(rows);
  //       /* generate html */
  //       const html = createHtml(table);
  //       /* write the generated html to file */
  //       fs.writeFileSync(buildPathHtml, html);
  //       console.log("Succesfully created an HTML table");
  //     } catch (error) {
  //       console.log("Error generating table", error);
  //     }
  //     const printPdf = async () => {
  //       console.log("Starting: Generating PDF Process, Kindly wait ..");
  //       /** Launch a headleass browser */
  //       const browser = await puppeteer.launch();
  //       /* 1- Ccreate a newPage() object. It is created in default browser context. */
  //       const page = await browser.newPage();
  //       /* 2- Will open our generated `.html` file in the new Page instance. */
  //       console.log(buildPathHtml);
  //       await page.goto(buildPathHtml, { waitUntil: "networkidle0" });
  //       /* 3- Take a snapshot of the PDF */
  //       const pdf = await page.pdf({
  //         format: "A4",
  //         margin: {
  //           top: "21px",
  //           right: "21px",
  //           bottom: "21px",
  //           left: "21px",
  //         },
  //       });
  //       /* 4- Cleanup: close browser. */
  //       await browser.close();
  //       console.log("Ending: Generating PDF Process");
  //       return pdf;
  //     };

  //     const init = async () => {
  //       try {
  //         const pdf = await printPdf();
  //         fs.writeFileSync(buildPathPdf, pdf);
  //         console.log("Succesfully created an PDF table");
  //         ptp.print(buildPathPdf, pdf);
  //       } catch (error) {
  //         console.log("Error generating PDF", error);
  //       }
  //     };

  //     init();
  // res.redirect("/");
});
// app.get("/printpdf", function (req, res) {
//   const options = {};
//   if (req.query.printer) {
//     options.printer = req.query.printer;
//   }
//   const tmpFilePath = path.join(`/build.pdf`);
//   // fs.writeFileSync(tmpFilePath, req.body, "binary");
//   ptp.print("build.pdf", options);
//   // fs.unlinkSync(tmpFilePath);
//   res.status(204);
//   res.redirect("/");
// });
app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/");
        });
      }
    }
  });
});
app.get("/logout", function (req, res) {
  // req.logout();
  // res.redirect("/");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});
app.post("/", function (req, res) {
  if (req.isAuthenticated()) {
    console.log("yes");
  } else {
    res.redirect("/login");
  }

  var source = req.body.sourceCity;
  var destination = req.body.destinationCity;
  var date = req.body.date;
  date = date.replace(/[^a-zA-Z0-9 ]/g, "");

  console.log(source);
  console.log(destination);
  console.log(date);
  const pahtUrl = "/TimeTable/" + source + "/" + destination + "/" + date + "/";
  console.log(pahtUrl);
  const options = {
    method: "GET",
    hostname: "timetable-lookup.p.rapidapi.com",
    port: null,
    // path: "/TimeTable/BOS/LAX/20231117/",
    path: pahtUrl,
    headers: {
      "X-RapidAPI-Key": "404b98d527msh4e8bd32bc2c6824p1ec47ejsne2e84476ee2a",
		"X-RapidAPI-Host": "timetable-lookup.p.rapidapi.com",
      useQueryString: true,
    },
  };
  https.get(options, function (response) {
    const chunks = [];
    response.on("data", function (chunk) {
      chunks.push(chunk);
    });
    var cnt = 0;
    const flightDetailsComb = [];
    response.on("end", function () {
      const body = Buffer.concat(chunks);
      // console.log(chunks.toString());
      const result = convert.xml2json(body, { compact: true, spaces: 4 });
      const flightData = JSON.parse(result);
      const newFlightData = flightData.OTA_AirDetailsRS.FlightDetails;
      const storeData = newFlightData.map(function (dataPrimary) {
        const data = dataPrimary.FlightLegDetails[0];
        var totalFlightTime = dataPrimary._attributes.TotalFlightTime;
        var departureTime = dataPrimary._attributes.FLSDepartureDateTime;
        var departureName = dataPrimary._attributes.FLSDepartureName;
        var arrivalName = dataPrimary._attributes.FLSArrivalName;
        var arrivalTime = dataPrimary._attributes.FLSArrivalDateTime;

        if (data) {
          var departureLocation =
            data.DepartureAirport._attributes.FLSLocationName;
          var departureCode = data.DepartureAirport._attributes.LocationCode;
          var arrivalLocation = data.ArrivalAirport._attributes.FLSLocationName;
          var arrivalCode = data.ArrivalAirport._attributes.LocationCode;
          var CompanyShortName =
            data.MarketingAirline._attributes.CompanyShortName;
          var bookingid = CompanyShortName + Math.floor(Math.random() * 1001);

          // console.log(CompanyShortName);
          // console.log(departureCode + " " + departureLocation + " --> " +arrivalCode + " " + arrivalLocation);
          // console.log(data.MarketingAirline._attributes);
          const flightDetails = [
            (bookingId = bookingid),
            (companySrtName = CompanyShortName),
            (arvCode = arrivalCode),
            (arvLocation = arrivalLocation),
            (departCode = departureCode),
            (departLocation = departureLocation),
            (arvTime = arrivalTime),
            (arvName = arrivalName),
            (departName = departureName),
            (departTime = departureTime),
            (totalFltTime = totalFlightTime),
          ];
          flightDetailsComb.push(flightDetails);
          //   res.render("lists", {
          //     CompanyShortName: CompanyShortName,
          //     arrivalCode: arrivalCode,
          //     arrivalLocation: arrivalLocation,
          //     departureCode: departureCode,
          //     departureLocation: departureLocation,
          //     arrivalTime: arrivalTime,
          //     arrivalName: arrivalName,
          //     departureName: departureName,
          //     departureTime: departureTime,
          //     totalFlightTime: totalFlightTime,
          //   });
        }
      });
      // console.log(flightdata.OTA_AirDetailsRS.FlightDetails[0].FlightLegDetails[0].MarketingAirline._attributes.CompanyShortName);
      // console.log(flightdata.OTA_AirDetailsRS.FlightDetails[0].FlightLegDetails[0]);
      // //commments..
      // res.write("<h1>Temperature in " + name + " is " + temp + " degrees</h1>")
      // res.write("<p>Weather desciption is " + weatherdesc + ".</p>")
      // res.write("<img src = " + imageurl + ">")
      //   res.send();
      res.render("lists", {
        flightDetailsComb,
      });
      // res.send();
    });
  });
});
app.listen(process.env.PORT || 3000, function () {
  console.log("Backend is Running Fine!");
});

/**
 * home route / rehne dete h ...
 * /login or /register, 2 routes create krte h ... DONE !!!
 * book press krne p fir /book route pe redirect ...
 *
 *
 *
 */
