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
var PDFDocument = require("pdfkit");

// Use Methods --->
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", true);
const dbUrl =
  "mongodb+srv://" +
  process.env.DB_USER +
  ":" +
  process.env.DB_PASSWORD +
  "@cluster0.gwuxrej.mongodb.net/?retryWrites=true&w=majority";
// const dbUrl = 'mongodb://127.0.0.1:27017';
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  username: {
    type: String,
    unique: false
  },
  secret: String
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
  new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "https://airgoworld.onrender.com/auth/google/airgo",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate({
          googleId: profile.id
        },
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
  passport.authenticate("google", {
    scope: ["profile"]
  })
);
app.get(
  "/auth/google/airgo",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/");
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
});

app.get("/book", function (req, res) {
  if (req.isAuthenticated()) {
    res.sendFile(__dirname + "/example.pdf");
  } else {
    res.redirect('/login');
  }
});
// posts requests..
app.post("/book", async (req, res) => {
  console.log(req.body.departDate);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("example.pdf"));
  const date =
    new Date().getDate() +
    "/" +
    new Date().getMonth() +
    "/" +
    new Date().getFullYear();
    data_inp = {
      bookId: req.body.bookingId,
      createdDate: date,
      departDate: req.body.departureTime,
      arrivalDate: req.body.arrivalTime,
      departure: req.body.departLocation,
      arrival: req.body.arrivalLocation,
      arrivalCode: req.body.arrivalCode,
      departureCode: req.body.departureCode,
      companyName: req.body.companySrtName,
      invoiceName: (Math.random() + 1).toString(36).substring(7),
    };
  const randomInt = Math.floor(Math.random() * 11);
  const imgpath = "./public/images/bg" + randomInt + ".jpg"

  console.log(data_inp);
  var dateFix = data_inp.createdDate.replace("T", " ");
  doc
    .image(imgpath, 50, 50, {
      width: 300,
      height: 150
    })
    .fillColor("#000")
    .fontSize(22)
    .text("AirGo", 275, 50, {
      align: "right"
    })
    .fontSize(13)
    .text(`Booking Id: ${data_inp.bookId}`, {
      align: "right"
    })
    .text(`Booking Date: ${dateFix}`, {
      align: "right"
    });

  doc.moveTo(50, 200).lineTo(550, 200).stroke();

  doc
    .fontSize(30, {
      bold: true
    })
    .text(`${data_inp.companyName || "Airlines"}`, 50, 210, {
      align: "center",
    });
  const beginningOfPage = 50;
  const endOfPage = 550;

  doc.moveTo(beginningOfPage, 240).lineTo(endOfPage, 240).stroke();
  const tableTop = 270;
  const departureX = 50;
  const departTimeX = 200;
  const arrivalX = 270;
  const arrivalTimeX = 350;
  const y = tableTop + 25;
  const ny = tableTop + 50;

  doc
    .fontSize(15)
    .text("Departure", departureX, tableTop, {
      bold: true
    })
    // .text("Departure Time", departTimeX, tableTop)
    .text("Arrival", arrivalX, tableTop);
  // .text("Arrival Time", arrivalTimeX, tableTop);
  const dp = data_inp.departure + " " + data_inp.departureCode;
  const av = data_inp.arrival + " " + data_inp.arrivalCode;
  doc
    .fontSize(10)
    .text(`${dp}`, departureX, y)
    // .text(`${data_inp.departDate}`, departTimeX, y)
    .text(`${av}`, arrivalX, y);
  // .text(`${data_inp.arrivalDate}`, arrivalTimeX, y);
  doc
    .fontSize(10)
    .text(`${data_inp.departDate}`, departureX, ny)
    .text(`${data_inp.arrivalDate}`, arrivalX, ny);

  doc.fontSize(10).text(`Thank You!`, 50, 700, {
    align: "center",
  });

  doc.end();

  // console.log(__dirname + "/example.pdf");
  res.redirect("/book");
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
app.post("/register", function (req, res) {
  User.register({
      username: req.body.username
    },
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
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  } else {
    var source = req.body.sourceCity;
    var destination = req.body.destinationCity;
    var date = req.body.date;
    date = date.replace(/[^a-zA-Z0-9 ]/g, "");
    // console.log(source);
    // console.log(destination);
    // console.log(date);
    const pahtUrl =
      "/TimeTable/" + source + "/" + destination + "/" + date;
    // console.log(pahtUrl);
    const options = {
      method: "GET",
      hostname: "timetable-lookup.p.rapidapi.com",
      port: null,
      // path: "/TimeTable/BOS/LAX/20231117/",
      path: pahtUrl,

      headers: {
        "X-RapidAPI-Key": process.env.API_KEY,
        "X-RapidAPI-Host": "timetable-lookup.p.rapidapi.com",
        useQueryString: true,
      },
    };
    https.get(options, function (response) {
      const chunks = [];
      response.on("data", function (chunk) {
        chunks.push(chunk);
      });
      const flightDetailsComb = [];
      response.on("end", function () {
        const body = Buffer.concat(chunks);
        // console.log(chunks.toString());
        const result = convert.xml2json(body, {
          compact: true,
          spaces: 4
        });
        const flightData = JSON.parse(result);
        const newFlightData = flightData.OTA_AirDetailsRS.FlightDetails;
        if (newFlightData) {
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
              var departureCode =
                data.DepartureAirport._attributes.LocationCode;
              var arrivalLocation =
                data.ArrivalAirport._attributes.FLSLocationName;
              var arrivalCode = data.ArrivalAirport._attributes.LocationCode;
              var CompanyShortName =
                data.MarketingAirline._attributes.CompanyShortName;
              var bookingid =
                CompanyShortName + Math.floor(Math.random() * 1001);
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
              // console.log(flightDetailsComb[0]);
            }
          });
        }
        // console.log(flightdata.OTA_AirDetailsRS.FlightDetails[0].FlightLegDetails[0].MarketingAirline._attributes.CompanyShortName);
        // console.log(flightdata.OTA_AirDetailsRS.FlightDetails[0].FlightLegDetails[0]);

        const currentPage = req.query.page || 1; // Default to first page if query param not provided

        res.render("lists", {
          flightDetailsComb,
          ctPage: currentPage
        });
      });
    });
  }
});
app.listen(process.env.PORT || 3000, function () {
  console.log("Backend is Running Fine!");
});