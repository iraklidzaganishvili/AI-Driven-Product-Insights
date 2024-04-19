$( function() {
    

    // --------- thumbnails images ---------
    var products = document.querySelectorAll(".product-card");
    products.forEach(function(product) {
    var mainImage = product.querySelector(".main-image");
    var thumbnails = product.querySelectorAll(".thumbnail");

        thumbnails.forEach(function(thumbnail) {
            thumbnail.addEventListener("click", function() {
            // remove "selected" class from all thumbnails in this product
            thumbnails.forEach(function(thumbnail) {
                thumbnail.classList.remove("selected");
            });
            // add "selected" class to clicked thumbnail
            thumbnail.classList.add("selected");
            // set main image src to clicked thumbnail src
            mainImage.setAttribute("src", thumbnail.getAttribute("src"));
            });
        });
    });

    

});

// ------------ swiper sliders -----------
$(document).ready(function() {

    // ------------ swiper sliders -----------
    var swiper = new Swiper('.header-slider3', {
        slidesPerView: 1,
        spaceBetween: 0,
        effect: "fade",
        // centeredSlides: true,
        speed: 1000,
        pagination: {
            el: '.header-slider3 .swiper-pagination',
            type: 'fraction',
        },
        navigation: {
            nextEl: '.header-slider3 .swiper-button-next',
            prevEl: '.header-slider3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 6000,
        },
        loop: true,
    });

    // ------------ tc-features-style3 -----------
    var swiper = new Swiper('.tc-features-style3 .categories-slider', {
        slidesPerView: 4,
        spaceBetween: 0,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-features-style3 .swiper-button-next',
            prevEl: '.tc-features-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 4,
            }
        }
    });

    // ------------ product details 3 -----------
    var galleryThumbs = new Swiper('.tc-deals-style3 .gallery-thumbs', {
        spaceBetween: 20,
        slidesPerView: 5,
        loop: false,
        freeMode: true,
        loopedSlides: 4, //looped slides should be the same
        direction: 'vertical',
      });
      var galleryTop = new Swiper('.tc-deals-style3 .gallery-top', {
        spaceBetween: 10,
        loop:false,
        loopedSlides: 4, //looped slides should be the same
        navigation: false,
        thumbs: {
          swiper: galleryThumbs,
        },
      });


      // ------------ posts-slider3 -----------
    var swiper = new Swiper('.posts-slider3', {
        slidesPerView: 1,
        spaceBetween: 20,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-deals-style3 .swiper-button-next',
            prevEl: '.tc-deals-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 6000,
        },
        loop: true,
    });


    // ------------ tc-features-style3 -----------
    var swiper = new Swiper('.tc-product-tabs-style3 .products-slider', {
        slidesPerView: 5,
        spaceBetween: 0,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-product-tabs-style3 .swiper-button-next',
            prevEl: '.tc-product-tabs-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 5,
            }
        }
    });


    // ------------ tc-features-style3 -----------
    var swiper = new Swiper('.tc-new-brands-style3 .new-brands-slider', {
        slidesPerView: 4,
        spaceBetween: 10,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-new-brands-style3 .swiper-button-next',
            prevEl: '.tc-new-brands-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 4,
            }
        }
    });

    // ------------ tc-features-style3 -----------
    var swiper = new Swiper('.tc-brand-box-style3 .products-slider', {
        slidesPerView: 5,
        spaceBetween: 0,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-brand-box-style3 .swiper-button-next',
            prevEl: '.tc-brand-box-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 5,
            }
        }
    });

    // ------------ tc-features-style3 -----------
    var swiper = new Swiper('.tc-recently-viewed-style3 .products-slider', {
        slidesPerView: 5,
        spaceBetween: 0,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-recently-viewed-style3 .swiper-button-next',
            prevEl: '.tc-recently-viewed-style3 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 4,
            }
        }
    });

});


// ------------ scripts -----------
$(document).ready(function(){

    // ------------ counter -----------
    const second = 1000,
    minute = second * 60,
    hour = minute * 60,
    day = hour * 24,
    week = hour * 24 * 7;

    let countDown = new Date('Sep 29, 2023 11:30').getTime(),
        x = setInterval(function() {

            let now = new Date().getTime(),
                distance = countDown - now;

            document.getElementById('days').innerText = Math.floor(distance / (day)),
            document.getElementById('hours').innerText = Math.floor((distance % (day)) / (hour)),
            document.getElementById('minutes').innerText = Math.floor((distance % (hour)) / (minute)),
            document.getElementById('seconds').innerText = Math.floor((distance % (minute)) / second);

            //do something later when date is reached
            //if (distance < 0) {
            //  clearInterval(x);
            //  'IT'S MY BIRTHDAY!;
            //}

        }, second)
});

