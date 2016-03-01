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
    set :docker_container_create_options, { "Privileged" => true }
  end

  describe service('nginx') do
    it { should be_running }
  end

  describe file('/usr/share/nginx/html/catalog_diff/s3_credentials.js') do
    it { should_not exist }
  end

  describe file('/usr/share/nginx/html/catalog_diff/data') do
    it { should be_symlink }
  end

  describe file('/usr/share/nginx/html/catalog_diff/reportlist.json') do
    it { should be_symlink }
  end

  describe file('/data') do
    it { should be_directory }
  end
end
