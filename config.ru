require "net/http"
require "uri"

# app root
@root = File.expand_path(File.dirname(__FILE__))

run Proc.new { |env|
  request = Rack::Request.new(env)
  path = Rack::Utils.unescape(env['PATH_INFO'])
  index_file = @root + "#{path}/oursophone.html"
  waveform_url = request.params["w"]
  if !waveform_url.nil? && !waveform_url.size.zero?
    waveform_url = "http://" + waveform_url 
    uri = URI.parse(waveform_url)
    # TODO : filter uri parts (whitelisting, regex, etc)
    http = Net::HTTP.new(uri.host, uri.port)
    if waveform_url =~ /^https/
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end
    request = Net::HTTP::Get.new(waveform_url)
    response = http.request(request)
    if response.code == "200"
      [200, {"Content-Type" => 'text/plain'}, [response.body]]
    else
      [404, {'Content-Type' => 'text/html'}, ["not found"]]
    end
  elsif File.exists?(index_file)
    # Return the index
    [200, {'Content-Type' => 'text/html'}, [File.read(index_file)]]
  else
    # Pass the request to the directory app
    Rack::Directory.new(@root).call(env)
  end
}
