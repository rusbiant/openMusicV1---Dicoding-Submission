const ClientError = require('../../exceptions/ClientError');

class UploadsHandler {
  constructor(service, albumsService, validator) {
    this._service = service;
    this._albumsService = albumsService;
    this._validator = validator;

    this.postUploadImagehandler = this.postUploadImagehandler.bind(this);
  }

  async postUploadImagehandler(request, h) {
    try {
      const { cover } = request.payload;
      const { id } = request.params;
      this._validator.validateImageHeaders(cover.hapi.headers);
      const filename = await this._service.writeFile(cover, cover.hapi);
      const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;
      await this._albumsService.editCoverById(id, fileLocation);

      const response = h.response({
        status: 'success',
        message: 'sampul berhasil di unggah',
        data: {
          fileLocation,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'maaf, terjadi kegagalan pada server kami',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = UploadsHandler;
