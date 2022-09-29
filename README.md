# Welcome to Bits

Hello competitor. This is the official source code for the bits competition 2022. You can contribute to this code by giving us Bugs, Improvements etc. This repository is also participating to hacktoberfest, so if you're also doing hacktoberfest this is a great chance. Please refer below about more details.

## Technologies and Packages Used

 - NodeJS
 - mongoose
 - connect-mongo
 - dotenv
 - ejs
 - express
 - express-session
 - google-auth-library
 - google-apis
 - jsonwebtoken
 - nodemailer
 - nodemon
 - request
 - sweetalert2
 - sass

We also used some internal technologies in this code which are not showed in this list. 

## How to run the code
This code is mainly made using express. Please refer below about how to run this code correctly.

 1. Clone this repository by running below command or downloading the zip file for the code.
```bash
git clone https://github.com/PasinduDushan/BITS22
```
 2. Change directory to the project folder
```bash
cd BITS22
```
 3.  Install the necessary dependencies. 
```bash
npm install --save
```
 4.  Go to ```.env``` file and then follow before instruction below to fill the env file properly.

##

### How to fill ```.env``` file.

 - ```TOKEN``` is a random string that is used to identify admin users when logging in to the webpage. You can generate a random hash or input one you like.
 - ```REGISTER_ID```,```CODING_ID```,```DESIGN_ID```, ```EXPLORE_ID```   filling follows the same pattern and this is the most trickiest to fill. First of all go to [Google Sheets](https://google.com/sheets). After that follow below steps.

    **Click on Blank**.
    ![enter image description here](https://i.imgur.com/f11WIAs.png)
    **Add the Spreadsheet name  as "Coding Tasks" and then copy the ID of the sheet. Do this process for other 2 sheets too. Which are Design Tasks & Explore Tasks. After copying all 3 IDs go to ```.env``` file and then fill the ```CODING_ID```,```DESIGN_ID```,```EXPLORE_ID```. After this go to the spredsheets again and then open the Coding Tasks sheet first.**

   **Click on the + button in the bottom of the page and then create Sub-Sheets in order as specified below. (This process goes to other 2 sheets too)**
   ![enter image description here](https://i.imgur.com/RwVqqEo.png)
   *Create Sub-Sheets in All 3 Sheets as specified below. (Please use these exact number when creating Sub-Sheets)*
   
    **Coding Tasks Sheet** -> *100, 200, 300, 400, 500, 600, 700, 800, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 8900, 9000, 9100*
    
    **Design Tasks Sheet** -> *900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 6300, 6400, 6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 9200, 9300, 9400*
    
    **Explore Tasks Sheet** -> *1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 4800, 4900, 7600, 7700, 7800, 7900, 8000, 8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800, 9500, 9600, 9700*.

	You need a ```Google Service Account``` to get access to the spreadsheets. We have to enable Google Sheets API in our project on Google developers console.

  **Go to [Google developer console](https://console.cloud.google.com/) and then create a new project with any name you want. Please refer below if you don't know how to create a Google Project.**
  
![Click on New Project](https://i.imgur.com/MmKtbP0.png)
 
 Click *Create*
 
![enter image description here](https://i.imgur.com/19Jy7FD.png)

After creating the project go to project dashboard and then click on **Enable APIs and Services** button. Search for **Google Sheets API** in the search bar and then once you see the result click on it and then click on **Enable**. 
![enter image description here](https://i.imgur.com/xVVooK6.png)

Once you enable Google Sheets API in your project, you will see the page where you can configure the settings for this API. Click on **Credentials** tab on the left sidebar. Here you will see a list of OAuth client IDs and service accounts. By default there should be none.

Click on **Create Credentials** button at the top and select **Service Account** option.
![enter image description here](https://i.imgur.com/K0VOMLo.png)

Enter the name and description of the service account and click **Create** button.
![enter image description here](https://i.imgur.com/R706EzO.png)

Click **Continue** on the next dialog

![enter image description here](https://i.imgur.com/06z3tvm.png)

On the next dialog, you get an option to create a key. This is an important step. Click on the **Create Key** button and choose **JSON** as the format. This will ask you to download the JSON file to your local machine.

For this tutorial, I have renamed the file and saved it as **credentials.json** on my local machine.

Keep it somewhere safe. This key file contains the credentials of the service account that we need in our Node.js script to access our spreadsheet from Google Sheets.

![enter image description here](https://i.imgur.com/QjNBxD7.png)

Once you've followed all of these steps, you should see the newly created service account on the credentials page
Take a note of the email address of the service account. We will need to share our spreadsheet with this account.

**Most IMPORTANT Part: Sharing the Spreadsheets with the ```Google Service Account```.**

Now that we have a service account, we need to share our spreadsheet with it. It's just like sharing a spreadsheet with any normal user account. Open all 3 spreadsheets in your browser and click on the **Share** button on top right corner. That will open a modal where you need to enter the email address of the service account. Uncheck the checkbox for **Notify people** since this will send an email and since service account does not have any mailbox, it will give you a mail delivery failure notification.

![enter image description here](https://i.imgur.com/FjRJUgM.png)

*This process must be done to all other 2 sheets also*. Click Share. And all the configurations are done. 
Now find the **credentials.json** file you renamed recently and put that file in the project folder. (Put in root directory). 

Now create another spreadsheet called ```Bits Registrations``` and then copy the ID of that spreadsheet also. Fill that ID in the ```REGISTER_ID``` field in ```.env``` file. 

**THIS STEP IS OPTIONAL AND CAN BE IGNORED**
Now we have to name some fields in the spreadsheets. Open **Coding Tasks, Design Tasks & Explore Tasks** spreadsheets and then fill the spreadsheets as below. (Repeat the same for other 2 sheets). 
![enter image description here](https://i.imgur.com/MFUlecq.png)

Now go to the **Bits Registration** spreadsheet and also fill it as below. 
![enter image description here](https://i.imgur.com/SZc14zL.png)
Share the **Google Service Account Email** with this spreadsheet too.

- ```SMTP_SERVER```,```SMTP_PORT```,```USERNAME``` & ```PASSWORD``` fields are used to send emails in the source code. You can use your existing SMTP credentials or create your own by referring below steps. (**Please note that Google Gmail stopped providing access to less secure apps recently.**).
