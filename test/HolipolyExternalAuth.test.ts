import { HolipolyExternalAuth } from "../src/HolipolyExternalAuth";
import { it, describe, expect } from "vitest";
import { ExternalProvider } from "../src";

describe("HolipolyExternalAuth", () => {
  it("initiates external authentication successfully", async ({}) => {
    const mockData = {
      externalAuthenticationUrl: {
        authenticationData: JSON.stringify({
          authorizationUrl: "https://holipoly.auth",
        }),
        errors: [],
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify({ data: mockData }));

    const auth = new HolipolyExternalAuth("https://holipoly.cloud.instance", ExternalProvider.OpenIDConnect);
    const url = await auth.initiate({ redirectURL: "https://holipoly.callback" });

    expect(url).toBe("https://holipoly.auth");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("obtains access token successfully", async ({}) => {
    const mockData = {
      externalObtainAccessTokens: {
        token: "abcdef",
        refreshToken: "abcdef",
        csrfToken: "abcdef",
        user: {},
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify({ data: mockData }));

    const auth = new HolipolyExternalAuth("https://holipoly.cloud.instance", ExternalProvider.OpenIDConnect);
    const data = await auth.obtainAccessToken({ code: "1234", state: "state" });

    expect(data).toEqual(mockData.externalObtainAccessTokens);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
