const { post } = require('../models');
const { uploadToS3 } = require('./helpers/s3helpers.js');

/* define post request handlers here */

module.exports = {
  createSnome: async (req, res) => {
    // 0. Accept request from client - uploadSnomePhotos middleware provides access to request.files
    // 1. create a snome record in db using non-file data from request returning id of inserted snome
    try {
      const inserted_id = await post.createSnome(req.body);
      res.status(201).send('Success!');
    } catch(err) {
      console.log(`SERVER SIDE ERROR - POST: ${err}`)
      res.status(500).send(err);
    }

    // 2. instantiate empty Promise array
    let uploadPhotoPromises = []

    // 3. loop over req.files...
    let photos = req.files.snome_photos;
    photos.forEach((photo) => {
      // call uploadToS3 function with fileName (object in array itself) and fileKey -> return promise
      // push each Promise onto Promise array
      try {
        uploadPhotoPromises.push(
          uploadToS3(photo, 'snome_photo')
        )  
      } catch(err) {
        console.log(`SERVER SIDE ERROR - POST: ${err}`)
        res.status(500).send(err);
      }
    }) 
      
    // 4. call Promise.all on promise array to upload files in parallel
    Promise.all(uploadPhotoPromises).then(
      async (urls) => {
        // 5. create snomePhotos in db using inserted_id and s3 urls
        urls.forEach(async url => {
          try {
            await post.createSnomePhoto(inserted_id, url)
          } catch(err) {
            console.log(`SERVER SIDE ERROR - POST: ${err}`);
            res.status(500).send(err);  // exit loop and respond to client
          }
        }) 
      }
    )

    // 5. respond with success to client if loop completes
    res.status(201).send('SUCCESS!');
  },

  
  createSnomePhotos: async (req, res) => {
    // 1. get snome id from request.params
    const snome_id = req.params.id;
    // 2. instantiate empty Promise array
    // 3. loop over req.files...
    // 4. call Promise.all on promise array to upload files in parallel
    // 5. create snomePhotos in db using snome_id and s3 urls

  },

  createUser: async (req, res) => {
    try {
      await post.createUser(req.body);
      res.status(201).send('Success!');
    } catch(err) {
      console.log(`SERVER SIDE ERROR - POST: ${err}`);
      res.status(500).send(err);
    }
  },

  createLike: async (req, res) => {
    post.createLike(req.body)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send(
        "Some error occurred while creating the Like."
        )
      })
  },

  createReview: async (req, res) => {
    post.createReview(req.body)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send(
        "Some error occurred while creating the review."
        )
      })
  },

  // <TEMPLATE>: async (req, res) => {
  //   try {
  //     let data = await get.<TEMPLATE>(req.body);
  //     res.status(200).json(data);
  //   } catch(err) {
  //     console.log(err);
  //     res.status(400).send(err);
  //   }
  // },

}