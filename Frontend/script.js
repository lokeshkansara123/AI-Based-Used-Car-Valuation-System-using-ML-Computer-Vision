// ==========================================
// API URL
// ==========================================

const API_URL = "http://127.0.0.1:8000/predict";


// ==========================================
// Image Preview
// ==========================================

const carImageInput =
    document.getElementById("carImage");

const previewImage =
    document.getElementById("previewImage");

const uploadContent =
    document.getElementById("uploadContent");


carImageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {

        alert("Please upload a valid image file.");

        this.value = "";

        return;
    }

    const imageURL =
        URL.createObjectURL(file);

    previewImage.src = imageURL;

    previewImage.style.display = "block";

    uploadContent.style.display = "none";

});


// ==========================================
// Prediction
// ==========================================

async function predictCar() {

    // ======================================
    // Get Image
    // ======================================

    const image =
        carImageInput.files[0];


    if (!image) {

        alert("Please upload a car image.");

        return;
    }


    // ======================================
    // Get Form Values
    // ======================================

    const year =
        document.getElementById("year").value;

    const kmDriven =
        document.getElementById("km_driven").value;

    const mileage =
        document.getElementById("mileage").value;

    const engine =
        document.getElementById("engine").value;

    const maxPower =
        document.getElementById("max_power").value;

    const torque =
        document.getElementById("torque").value;

    const seats =
        document.getElementById("seats").value;

    const fuel =
        document.getElementById("fuel").value;

    const sellerType =
        document.getElementById("seller_type").value;

    const transmission =
        document.getElementById("transmission").value;

    const owner =
        document.getElementById("owner").value;


    // ======================================
    // Basic Validation
    // ======================================

    if (
        !year ||
        !kmDriven ||
        !mileage ||
        !engine ||
        !maxPower ||
        !torque ||
        !seats ||
        !fuel ||
        !sellerType ||
        !transmission ||
        !owner
    ) {

        alert(
            "Please fill all vehicle details."
        );

        return;
    }


    // ======================================
    // Year Validation
    // Dataset Range: 1983 - 2020
    // ======================================

    const yearValue =
        Number(year);


    if (
    yearValue < 1983 ||
    yearValue > 2026
) {

    alert(
        "Please enter a car year between 1983 and 2026."
    );

    return;
}


    // ======================================
    // Numeric Validation
    // ======================================

    const kmValue =
        Number(kmDriven);

    const mileageValue =
        Number(mileage);

    const engineValue =
        Number(engine);

    const powerValue =
        Number(maxPower);

    const torqueValue =
        Number(torque);

    const seatsValue =
        Number(seats);


    if (
        kmValue < 0 ||
        mileageValue <= 0 ||
        engineValue <= 0 ||
        powerValue <= 0 ||
        torqueValue <= 0 ||
        seatsValue < 1 ||
        seatsValue > 20
    ) {

        alert(
            "Please enter valid vehicle values."
        );

        return;
    }


    // ======================================
    // Create FormData
    // ======================================

    const formData =
        new FormData();


    // Image

    formData.append(
        "image",
        image
    );


    // Year

    formData.append(
        "year",
        year
    );


    // KM Driven

    formData.append(
        "km_driven",
        kmDriven
    );


    // Mileage

    formData.append(
        "mileage",
        mileage
    );


    // Engine

    formData.append(
        "engine",
        engine
    );


    // Max Power

    formData.append(
        "max_power",
        maxPower
    );


    // Torque

    formData.append(
        "torque",
        torque
    );


    // Seats

    formData.append(
        "seats",
        seats
    );


    // Fuel

    formData.append(
        "fuel",
        fuel
    );


    // Seller Type

    formData.append(
        "seller_type",
        sellerType
    );


    // Transmission

    formData.append(
        "transmission",
        transmission
    );


    // Owner

    formData.append(
        "owner",
        owner
    );


    // ======================================
    // Loading
    // ======================================

    const loading =
        document.getElementById("loading");

    const predictBtn =
        document.getElementById("predictBtn");


    loading.style.display = "flex";

    predictBtn.disabled = true;


    // Change button text

    const originalButtonText =
        predictBtn.textContent;

    predictBtn.textContent =
        "Predicting...";


    // ======================================
    // API Request
    // ======================================

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        // ==================================
        // Get API Response
        // ==================================

        const data =
            await response.json();


        console.log(
            "API Response:",
            data
        );


        // ==================================
        // Handle API Error
        // ==================================

        if (!response.ok) {

            const errorMessage =
                data.detail ||
                "Prediction request failed.";

            throw new Error(
                errorMessage
            );
        }


        // ==================================
        // Display Result
        // ==================================

        showResult(
            data,
            image
        );


    } catch (error) {

        console.error(
            "Prediction Error:",
            error
        );


        alert(
            "Prediction failed:\n\n" +
            error.message
        );


    } finally {

        // Hide loading

        loading.style.display =
            "none";


        // Enable button

        predictBtn.disabled =
            false;


        // Restore button text

        predictBtn.textContent =
            originalButtonText;

    }

}


// ==========================================
// Show Result
// ==========================================

function showResult(
    data,
    imageFile
) {

    // ======================================
    // Get Result Elements
    // ======================================

    const resultSection =
        document.getElementById("result");


    const resultImage =
        document.getElementById(
            "resultCarImage"
        );


    const resultModel =
        document.getElementById(
            "resultModel"
        );


    const resultBrand =
        document.getElementById(
            "resultBrand"
        );


    const confidence =
        document.getElementById(
            "confidence"
        );


    const confidenceStatus =
        document.getElementById(
            "confidenceStatus"
        );


    const resultPrice =
        document.getElementById(
            "resultPrice"
        );


    // ======================================
    // Result Image
    // ======================================

    resultImage.src =
        URL.createObjectURL(
            imageFile
        );


    // ======================================
    // Predicted Model
    // ======================================

    resultModel.textContent =
        data.predicted_model;


    // ======================================
    // Brand
    // ======================================

    resultBrand.textContent =
        data.brand;


    // ======================================
    // CNN Confidence
    // ======================================

    confidence.textContent =
        data.cnn_confidence + "%";


    // ======================================
    // Confidence Status
    // ======================================

    confidenceStatus.textContent =
        data.confidence_status;


    // ======================================
    // Predicted Price
    // ======================================

    resultPrice.textContent =
        formatIndianCurrency(
            data.predicted_price
        );


    // ======================================
    // Show Result
    // ======================================

    resultSection.style.display =
        "block";


    // ======================================
    // Scroll To Result
    // ======================================

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// Indian Currency Formatter
// ==========================================

function formatIndianCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",

            currency: "INR",

            maximumFractionDigits: 0
        }
    ).format(value);

}