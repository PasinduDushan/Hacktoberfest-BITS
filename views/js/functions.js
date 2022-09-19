function submitForm(form) {
    Swal.fire({
        title: "Are you sure?",
        text: "The task will be added to the database",
        showCancelButton: true,
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })
    .then(function (isOkay) {
        if (isOkay.isConfirmed) {
            form.submit();
        }
    });
    return false;
}