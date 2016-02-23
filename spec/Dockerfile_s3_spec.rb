require "serverspec"
require "docker"

describe "Dockerfile" do
  before(:all) do
    # See https://github.com/swipely/docker-api/issues/106
    Excon.defaults[:write_timeout] = 1000
    Excon.defaults[:read_timeout] = 1000
    image = Docker::Image.build_from_dir('.')

    set :os, family: :debian
    set :backend, :docker
    set :docker_image, image.id
    set :docker_container_create_options, {
      "Privileged" => true,
      "Env" => [
        "S3_BUCKET=my-bucket",
        "S3_ACCESS_KEY=my-access",
        "S3_SECRET_KEY=my-secret"
      ],
    }
  end

  describe service('nginx') do
    it { should be_running }
  end
  describe file('/usr/share/nginx/html/catalog_diff/s3_credentials.js') do
    it { should exist }
    its(:content) { should match(/s3_bucketName = 'my-bucket'/) }
    its(:content) { should match(/s3_access_key = 'my-access'/) }
    its(:content) { should match(/s3_secret_key = 'my-secret'/) }
  end
end

