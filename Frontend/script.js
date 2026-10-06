const API_URL = "http://127.0.0.1:8000/predict";

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

async function predictCar() {

    const image =
        carImageInput.files[0];


    if (!image) {

        alert("Please upload a car image.");

        return;
    }


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

    const formData =
        new FormData();
    

    formData.append(
        "image",
        image
    );


    formData.append(
        "year",
        year
    );


    // KM Driven

    formData.append(
        "km_driven",
        kmDriven
    );


    formData.append(
        "mileage",
        mileage
    );

    formData.append(
        "engine",
        engine
    );

    formData.append(
        "max_power",
        maxPower
    );


    formData.append(
        "torque",
        torque
    );


    formData.append(
        "seats",
        seats
    );

    formData.append(
        "fuel",
        fuel
    );

    formData.append(
        "seller_type",
        sellerType
    );

    formData.append(
        "transmission",
        transmission
    );

    formData.append(
        "owner",
        owner
    );

    const loading =
        document.getElementById("loading");

    const predictBtn =
        document.getElementById("predictBtn");


    loading.style.display = "flex";

    predictBtn.disabled = true;

    const originalButtonText =
        predictBtn.textContent;

    predictBtn.textContent =
        "Predicting...";

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();


        console.log(
            "API Response:",
            data
        );


        if (!response.ok) {

            const errorMessage =
                data.detail ||
                "Prediction request failed.";

            throw new Error(
                errorMessage
            );
        }


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

    
        loading.style.display =
            "none";


        predictBtn.disabled =
            false;



        predictBtn.textContent =
            originalButtonText;

    }

}


function showResult(
    data,
    imageFile
) {


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


    resultImage.src =
        URL.createObjectURL(
            imageFile
        );


    resultModel.textContent =
        data.predicted_model;


    resultBrand.textContent =
        data.brand;


    confidence.textContent =
        data.cnn_confidence + "%";


    confidenceStatus.textContent =
        data.confidence_status;


    resultPrice.textContent =
        formatIndianCurrency(
            data.predicted_price
        );


    resultSection.style.display =
        "block";


    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


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
