window.onscroll = function() {
    var navbar = document.querySelector(".navbar");
    if (window.pageYOffset > 0) {
        /* replace 0 with the height of your navbar */
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };